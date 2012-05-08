require 'nokogiri'
require 'uri'
require 'open-uri'
require 'json'
require 'web_services/soybase'

module WebServices
  class Configuration
    attr_accessor :uris

    def initialize
      self.uris = {}
    end
  end

  class << self
    attr_accessor :configuration
  end

  def self.configure
    self.configuration ||= Configuration.new
    yield(configuration) if block_given?
  end
end
