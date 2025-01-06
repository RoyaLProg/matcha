if [ ! -d node_modules ]; then
	npm install
fi 

npx vite --host
