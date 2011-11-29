Soda::Application.routes.draw do
  devise_for :users

  resources :docs

  match "/user" => "docs#index", :as => :user_root

  match "delete_doc/:id" => "docs#destroy", :as => :delete_doc

  match "/unknown_doc" => "pages#unknown_doc"

  root :to => "pages#home"
end
