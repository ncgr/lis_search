module WebServices
  class Base

    def initialize(query)
      @query   = CGI.escape(query.to_s)
      @results = []
      WebServices.configuration.uris.each do |k, v|
        begin
          open(v + @query) do |l|
            l.each_line do |line|
              @results << { k => JSON.load(line) }
            end
          end
        rescue
          next
        end
      end
    end

    def parse
      JSON.generate(@results)
    end

  end
end
