class ChangeOptionsFormat < ActiveRecord::Migration
  def self.up
		change_column :docs, :options, :string, :default => '{"private":true}'
  end

  def self.down
  end
end
