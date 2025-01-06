if [ ! -d node_modules ]; then
	npm install
	npm install -g nest
fi 

npm run start:dev
