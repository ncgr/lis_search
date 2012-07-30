class Search

  def self.exec_query(query = nil)
    return [].to_json if query.nil?
    WebServices::Base.new(query).parse
  end

end
