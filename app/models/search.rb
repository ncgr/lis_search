class Search

  def self.exec_query(query = nil)
    results = {}
    if query.present?
      results = WebServices::Soybase.new(query).parse
    end
    results
  end

end
