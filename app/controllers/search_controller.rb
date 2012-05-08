class SearchController < ApplicationController

  def index
    @results = Search.exec_query(params[:q])
  end

end
