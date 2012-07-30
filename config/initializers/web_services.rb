require File.expand_path('../../../lib/web_services', __FILE__)

WebServices.configure do |config|
  config.uris = {
    :phavu => 'http://soybase.org:8090/qtls/show_json/',
    :glyma => 'http://soybase.org:8091/qtls/show_json/'
  }
end
