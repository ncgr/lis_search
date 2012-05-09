module WebServices
  class Soybase

    def initialize(query)
      query = CGI.escape(query.to_s)
      @uri  = WebServices.configuration.uris[:soybase] << query
      @doc  = Nokogiri::XML(open(@uri)) do |config|
        config.noblanks
      end
      @results = []
    end

    def parse
      @doc.root.children.each do |d|
        if d.name == "result"
          d.children.each do |result|
            if result.name == "qtl"
              data = {
                :map_symbol  => result.xpath('map_symbol/text()').to_s,
                :trait_name  => result.xpath('trait_name/text()').to_s,
                :qtl_url     => result.xpath('qtl_url/text()').to_s,
                :qtl_map_url => result.xpath('qtl_map_url/text()').to_s,
                :map         => [],
              }
              data[:map] << {
                :map_type      => result.xpath('map/map_type/text()').to_s,
                :map_name      => result.xpath('map/map_name/text()').to_s,
                :linkage_group => result.xpath('map/linkage_group/text()').to_s,
                :map_position  => [],
              }
              data[:map].last[:map_position] << {
                :start_pos => result.xpath('map/map_position/start_pos/text()').to_s,
                :end_pos   => result.xpath('map/map_position/end_pos/text()').to_s,
              }
              @results << data
            end
          end
        end
      end
      JSON.generate(@results)
    end
  end
end
