FROM ruby:3.2

# Install required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    nodejs

# Set working directory
WORKDIR /app

# Update RubyGems and install specific versions
RUN gem update --system && \
    gem install bundler

# Copy Gemfile
COPY Gemfile .

# Install dependencies
RUN bundle install

# Copy the rest of the application
COPY . .

# Expose port 4000
EXPOSE 4000

# Command to serve the site
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]