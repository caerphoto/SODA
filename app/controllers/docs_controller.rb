class DocsController < ApplicationController
	def get_user
		user_signed_in? ? current_user.id : nil
	end

	def index
		if user_signed_in?
			@docs = current_user.docs
		else
			@docs = nil
		end
	end

	def show
		@doc_id = params[:id]

		user_id = get_user

		@doc = Doc.get(@doc_id, user_id)

		respond_to do |format|
			format.html do
				if @doc == :unauthorized
					flash[:alert] = "Only the owner of that document may view it."
					redirect_to new_user_session_path
				elsif @doc == :not_found
					redirect_to unknown_doc_path
				end
			end

			format.json { render :json => @doc }
		end
	end

	def edit
		@doc_id = params[:id]

		user_id = get_user

		@doc = Doc.get(@doc_id, user_id)

		respond_to do |format|
			format.html do
				if @doc == :unauthorized
					flash[:alert] = "Only the owner of that document may edit it."
					redirect_to new_user_session_path
				elsif @doc == :not_found
					redirect_to unknown_doc_path
				end
			end

			format.json { render :json => @doc }
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
		user_id = get_user
		@doc_id = params[:id]
		@doc = Doc.get(@doc_id, user_id)

		sleep 1

		if @doc
			if @doc != :unauthorized
				@doc.content = params[:content]
				@doc.title = params[:title]

				if @doc.save
					render :text => "SUCCESS"
				else
					render :text => "NO_SAVE"
				end
			else
				render :text => "UNAUTHORIZED - doc owner = #{@doc_id}, your id = #{user_id}"
			end

		else
			render :text => "NOT_FOUND"
		end
	end


end
