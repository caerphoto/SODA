class DocsController < ApplicationController
  def index
    # temporary - comment this out or change it to use this app's README.md
    @default_doc = open("README.md").read;
  end

  def show
    render :text => "HELLO";
  end
end
