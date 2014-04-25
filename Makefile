MOCHA_OPTS = 
REPORTER = dot

PATH := ./node_modules/.bin:${PATH}

.PHONY : init clean-docs clean build test dist publish

init:
	npm install

docs:
	docco src/*.coffee

clean-docs:
	rm -rf docs/

clean: clean-docs
	rm -rf lib/ test/*.js

build:
	coffee -o lib/ -c src/

test: build
	@NODE_ENV=test mocha \
		--reporter $(REPORTER) \
		--compilers coffee:coffee-script \
		$(MOCHA_OPTS)

test-cov: lib-cov
	@RESTFUL_COV=1 $(MAKE) test REPORDER=html-cov > coverage.html

test-server: build
	node examples/movies/index.js

lib-cov:
	@jscoverage lib lib-cov

dist: clean init docs build test

publish: dist
	npm publish

example: build
	node examples/movies
