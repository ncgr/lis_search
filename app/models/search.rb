class Search

  def self.exec_query(query = nil)
    WebServices::Soybase.new(query).parse
  end

end
