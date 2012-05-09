LisSearch::Application.routes.draw do
  root :to => "home#index"
  resources :search, :only => [:index]
end
