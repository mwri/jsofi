node_modules:
	npm install

test: node_modules
	npm run test

coverage: node_modules
	npm run coverage

.PHONY: test coverage
