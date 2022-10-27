SHELL += -eu

build: clear
	env CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build -o ./dist/lambda/sfn-trigger ./src/lambda/sfn-trigger
	env CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build -o ./dist/lambda/notify ./src/lambda/notify
	env CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build -o ./dist/cr/trigger-fn ./src/constructs/trigger-fn
	env CGO_ENABLED=0 GOARCH=amd64 GOOS=linux go build -o ./dist/cr/webhook-manager-fn ./src/constructs/webhook-manager-fn

	strip ./dist/lambda/*
	strip ./dist/cr/*
	zip ./dist/sfn-trigger.zip ./dist/lambda/sfn-trigger
	zip ./dist/notify.zip ./dist/lambda/notify
	zip ./dist/webhook-manager-fn.zip ./dist/cr/webhook-manager-fn
	zip ./dist/trigger-fn.zip ./dist/cr/trigger-fn

clear: gendirectory
	rm -rf ./dist/*

gendirectory:
	mkdir -p dist
