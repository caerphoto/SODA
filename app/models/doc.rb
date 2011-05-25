class Doc < ActiveRecord::Base
	require 'JSON'

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

	def private
		JSON.load(self.options)["private"]
	end

	def linebreaks
		JSON.load(self.options)["linebreaks"]
	end

	def smartquotes
		JSON.load(self.options)["smartquotes"]
	end

	def set_options(new_opts={})
		self.options = JSON.load(self.options).merge(new_opts).to_json
	end

	def as_json
		{
			:content => self.content,
			:author => self.user.id
		}
	end
end
