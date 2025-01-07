if [ ! -d node_modules ]; then
	npm install
	npm install -g nest
	npm i --save @nestjs/typeorm typeorm pg
fi

npm run start:dev
