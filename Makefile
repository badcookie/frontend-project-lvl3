install:
	npm install

lint:
	npx eslint .

test:
	npm test

coverage:
	npm test -- --coverage
