MOCHA_OPTS = 
REPORTER = dot

PATH := ./node_modules/.bin:${PATH}

.PHONY : init clean-docs clean build test dist publish lib-cov

init:
	npm install

docs:
	docco src/*.coffee

clean-docs:
	rm -rf docs/

clean: clean-docs
	rm -rf lib/ src-cov/ test/*.js

build:
	node_modules/.bin/coffee -o lib/ -c src/

test: build
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--compilers coffee:coffee-script/register \
		$(MOCHA_OPTS) \
		test/*.coffee	

test-cov: build lib-cov
	@RESTFUL_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

test-server: build
	node examples/movies/index.js

lib-cov:
	./node_modules/.bin/coffeeCoverage src src-cov

dist: clean init docs build test

publish: dist
	npm publish

example: build
	node examples/movies
