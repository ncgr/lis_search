require File.expand_path('../../../lib/web_services', __FILE__)

WebServices.configure do |config|
  config.uris = {
    :soybase => 'http://www.soybase.org/gmodrpc/v1.1/xml/qtlxml.php?xml=1&qtl='
  }
end
