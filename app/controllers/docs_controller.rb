class DocsController < ApplicationController
  attr_accessor :user_id

  before_filter :get_user

  def get_user
    self.user_id = user_signed_in? ? current_user.id : nil
  end

  def index
    @title = "Your Saved Documents - Soda"
    if user_signed_in?
      @docs = current_user.docs.order(:title)
      @docs_json = []

      @docs.each do |doc|
        dd = doc.updated_at
        dt = doc.updated_at

        if params[:format] == "json"
          content = doc.content
        else
          content = ""
        end

        @docs_json.push({
          :name => doc.title,
          :view_path => doc_path(doc),
          :edit_path => edit_doc_path(doc),
          :delete_path => delete_doc_path(doc),
          :date => [ dd.year, dd.month, dd.day ].join("/"),
          :time => [ dt.hour, dt.min ].join(":"),
          :size => doc.content.length,
          :content => content

        })
      end

    else
      @docs = nil
    end

    if params[:format] == "json"
      send_data @docs_json.to_json, filename: "all_documents.json"
    end
  end

  def show
    @doc = Doc.get(params[:id], user_id)

    if @doc
      respond_to do |format|
        format.html do
          if @doc == :unauthorized
            flash[:alert] = "Only the owner of that document may view it."
            redirect_to new_user_session_path
          end
        end

        format.json { render :json => @doc }
      end
    else
      redirect_to unknown_doc_path
    end
  end

  def edit
    @doc = Doc.edit(params[:id], user_id)

    if @doc
      respond_to do |format|
        format.html do
          if @doc == :unauthorized
            flash[:alert] = "Only the owner of that document may edit it."
            redirect_to new_user_session_path, :status => 401
          end
        end

        format.json { render :json => @doc }
      end
    else
      redirect_to unknown_doc_path
    end
  end

  def create
    if user_signed_in?
      @doc = current_user.docs.build(:content => "")
      @doc.set_options({
        "private" => true,
        "smartquotes" => true,
        "smartdashes" => true })
    else
      @doc = Doc.create(:user_id => 0)
    end

    if @doc.save
      redirect_to edit_doc_path(@doc)
    else
      redirect_to docs_path(:alert => "Unable to create new document.")
    end
  end

  def update
    doc_id = params[:id]
    @doc = Doc.edit(doc_id, user_id)
    #sleep 3

    if @doc
      if @doc != :unauthorized
        @doc.content = params[:content]
        @doc.title = params[:title]

        new_opts = {
          "private" => params[:privateDoc] == "true",
          "linebreaks" => params[:linebreaks] == "true",
          "smartquotes" => params[:smartQuotes] == "true",
          "smartdashes" => params[:smartDashes] == "true"
        }
        @doc.set_options(new_opts)

        if @doc.save
          render :text => "SUCCESS", :status => 200
        else
          render :text => "NO_SAVE", :status => 500 # couldn't save, don't know why
        end
      else
        render :text => "UNAUTHORIZED - doc owner = #{doc_id}, your id = #{user_id}",
          :status => 401
      end

    else
      render :text => "NOT_FOUND", :status => 404
    end
  end

  def destroy
    doc = Doc.find params[:id]

    if doc.user_id == user_id
      flash[:notice] = "Document deleted."
      doc.destroy
    else
      flash[:alert] = "Unable to delete document."
    end

    redirect_to docs_path
  end

end
