class Doc < ActiveRecord::Base
	require 'json'

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

	# TODO: refactor this to use method_missing?
	def private
		JSON.parse(self.options || "{}")["private"]
	end

	def linebreaks
		JSON.parse(self.options || "{}")["linebreaks"]
	end

	def smartquotes
		JSON.parse(self.options || "{}")["smartquotes"]
	end

	def smartdashes
		JSON.parse(self.options || "{}")["smartdashes"]
	end

	def set_options(new_opts={})
		self.options = new_opts.to_json
	end

	def as_json
		{
			:content => self.content,
			:author => self.user.id
		}
	end
end
