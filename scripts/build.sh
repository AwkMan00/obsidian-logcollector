#!/bin/bash

VERSION="3.0.1"

#Get script path
SCRIPTPATH="$(dirname $(realpath $0))"

#Change to script path
cd "$SCRIPTPATH"
if [[ $? -ne 0 ]]
then
	echo "Error changing to directory $SCRIPTPATH"
	exit 1
fi


#Go one level back where the repository is
cd ..
if [[ $? -ne 0 ]]
then
	echo "Error changing to directory $(dirname ${SCRIPTPATH})"
	exit 1
fi

#Replace building time and version in src/plugin-info.json and src/plugin-info.ts file
sed -i '/pluginReleasedAt/s/: ".*"/: "'$(date +"%Y-%02m-%02dT%02H:%02M:%02S%z")'"/' src/plugin-info.json src/plugin-info.ts
sed -i '/pluginVersion/s/: ".*"/: "'$VERSION'"/' src/plugin-info.json src/plugin-info.ts

#Replace version in manifest.json and package.json
sed -i '/"version":/s/: ".*"/: "'$VERSION'"/' manifest.json
sed -i '/"version":/s/: ".*"/: "'$VERSION'"/' package.json

#Change version in package-lock.json
sed -i '3s/: ".*"/: "'$VERSION'"/' package-lock.json 
sed -i '9s/: ".*"/: "'$VERSION'"/' package-lock.json 


#Build application
npm run build
if [[ $? -ne 0 ]]
then
	echo "Error building package"
	exit 1
fi

#Create zip package with distribution files and source code
rm -f dist/obsidian-logcollector*.zip dist/obsidian-logcollector*.tar.gz
7z a -mx=9 dist/obsidian-logcollector-src-${VERSION}.zip CHANGELOG.md esbuild.config.mjs .eslintrc LICENSE.md package.json README.md src versions.json data.json .editorconfig .eslintignore .gitignore manifest.json .npmrc package-lock.json scripts tsconfig.json
tar -cvzf dist/obsidian-logcollector-src-${VERSION}.tar.gz CHANGELOG.md esbuild.config.mjs .eslintrc LICENSE.md package.json README.md src versions.json data.json .editorconfig .eslintignore .gitignore manifest.json .npmrc package-lock.json scripts tsconfig.json

cd dist
7z a -mx=9 obsidian-logcollector-dist-${VERSION}.zip main.js manifest.json

