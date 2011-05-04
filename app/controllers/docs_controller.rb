class DocsController < ApplicationController
  def index
    @default_doc = open("sample.md").read;
  end

  def show
    render :text => "HELLO";
  end
end
