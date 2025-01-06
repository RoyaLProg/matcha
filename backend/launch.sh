if [ ! -d node_modules ]; then
	npm install
	npm install -g nest
	npm i --save @nestjs/typeorm typeorm
fi

npm run start:dev
