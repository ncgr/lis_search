LisSearch::Application.routes.draw do
  root :to => "search#index"
  resources :search, :only => [:index]
end
