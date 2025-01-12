if [ ! -d node_modules ]; then
	npm install
	npm install jwt-decode
fi 

npx vite --host
