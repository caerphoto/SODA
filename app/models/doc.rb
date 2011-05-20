class Doc < ActiveRecord::Base
	belongs_to :user

	def self.get(id, user_id=nil)
		if self.exists? id
			doc = self.find(id)

			if doc.private and doc.user_id != user_id
				:unauthorized
			else
				doc
			end
		end
	end

	def self.edit(id, user_id=nil)
		if self.exists? id
			doc = self.find(id)

			if doc.user_id != user_id
				:unauthorized
			else
				doc
			end
		end
	end

	def as_json
		{
			:content => self.content,
			:author => self.user.id
		}
	end
end
