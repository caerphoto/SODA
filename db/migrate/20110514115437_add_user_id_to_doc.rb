class AddUserIdToDoc < ActiveRecord::Migration
  def self.up
    add_column :docs, :user_id, :integer
    add_column :users, :name, :string
  end

  def self.down
    remove_column :docs, :user_id
    remove_column :users, :name
  end
end
