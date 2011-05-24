class DocsController < ApplicationController
	attr_accessor :user_id

	before_filter :get_user

	def get_user
		self.user_id = user_signed_in? ? current_user.id : nil
	end

	def index
		@title = "Your Saved Documents - Soda"
		if user_signed_in?
			@docs = current_user.docs
		else
			@docs = nil
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
						redirect_to new_user_session_path
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
		#sleep 1

		if @doc
			if @doc != :unauthorized
				@doc.content = params[:content]
				@doc.title = params[:title]
				@doc.private = params[:privateDoc] == "true"
				@doc.linebreaks = params[:linebreaks] == "true"

				if @doc.save
					render :text => "SUCCESS"
				else
					render :text => "NO_SAVE"
				end
			else
				render :text => "UNAUTHORIZED - doc owner = #{doc_id}, your id = #{user_id}"
			end

		else
			render :text => "NOT_FOUND"
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
