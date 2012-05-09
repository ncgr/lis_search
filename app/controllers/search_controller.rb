class SearchController < ApplicationController

  def index
    @results = Search.exec_query(params[:q])
    render json: @results
  end

end
