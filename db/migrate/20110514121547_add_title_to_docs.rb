class AddTitleToDocs < ActiveRecord::Migration
  def self.up
    add_column :docs, :title, :string
  end

  def self.down
    remove_column :docs, :title
  end
end
