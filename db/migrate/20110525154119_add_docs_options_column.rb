class AddDocsOptionsColumn < ActiveRecord::Migration
  def self.up
		remove_column :docs, :linebreaks
		remove_column :docs, :private

		add_column :docs, :options, :string, :default => "private:true"
  end

  def self.down
		add_column :docs, :linebreaks, :boolean, :default => false
		add_column :docs, :private, :boolean, :default => true
  end
end
