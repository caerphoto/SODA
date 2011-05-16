class DocContentToTextType < ActiveRecord::Migration
  def self.up
    change_column :docs, :content, :text
  end

  def self.down
    change_column :docs, :content, :string
  end
end
