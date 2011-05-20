class AddDocsLinebreaksColumn < ActiveRecord::Migration
  def self.up
		add_column :docs, :linebreaks, :boolean, :default => false
  end

  def self.down
		remove_column :docs, :linebreaks
  end
end
