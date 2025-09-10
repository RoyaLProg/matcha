if [ ! -d node_modules ]; then
	npm install
	npm install -g nest
	npm i --save pg
	npm i speakeasy
	npm i qrcode
fi

npm run start:dev
