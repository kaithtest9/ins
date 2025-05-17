npm install
# create table if not exists
npx drizzle-kit pull
npx drizzle-kit db:generate
npx drizzle-kit db:migrate

cd ui && npm install && npm run build
cd ..
npm run build
