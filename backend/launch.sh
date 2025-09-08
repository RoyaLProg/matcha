if [ ! -d node_modules ]; then
	npm install
	npm install -g nest
	npm i --save pg
fi

npm run start:dev
