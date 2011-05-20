class AddDocPrivacyColumn < ActiveRecord::Migration
  def self.up
		add_column :docs, :private, :boolean, :default => true
  end

  def self.down
		remove_column :docs, :private
  end
end
