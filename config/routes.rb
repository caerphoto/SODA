Soda::Application.routes.draw do
	devise_for :users

	resources :docs

	match "/unknown_doc" => "pages#unknown_doc"

	root :to => "pages#home"
end
