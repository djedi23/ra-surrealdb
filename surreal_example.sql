-- ------------------------------
-- OPTION
-- ------------------------------

OPTION IMPORT;

-- ------------------------------
-- SCOPES
-- ------------------------------

DEFINE SCOPE account_scope SESSION 1d SIGNUP (CREATE scopeusers SET user = type::thing('author',$user), pass = crypto::argon2::generate($pass)) SIGNIN (SELECT * FROM scopeusers WHERE user = type::thing('author',$user) AND crypto::argon2::compare(pass, $pass));


DEFINE TABLE scopeusers SCHEMALESS PERMISSIONS FOR select WHERE session::sc() = "account_scope";


-- ------------------------------
-- TABLE: account
-- ------------------------------

DEFINE TABLE account SCHEMALESS PERMISSIONS NONE;

-- ------------------------------
-- TABLE: article
-- ------------------------------

DEFINE TABLE article SCHEMALESS PERMISSIONS FOR select WHERE session::sc() = "account_scope", FOR create WHERE session::sc() = "account_scope", FOR update WHERE session::sc() = "account_scope", FOR delete WHERE session::sc() = "account_scope";

-- ------------------------------
-- TABLE: author
-- ------------------------------

DEFINE TABLE author SCHEMALESS PERMISSIONS  FOR select WHERE session::sc() = "account_scope", FOR create NONE, FOR update WHERE session::sc() = "account_scope", FOR delete NONE;


-- ------------------------------
-- TRANSACTION
-- ------------------------------

BEGIN TRANSACTION;

-- ------------------------------
-- TABLE DATA: account
-- ------------------------------

UPDATE account:1pafmu53haty8x8uanpk CONTENT { created_at: "2023-03-10T14:59:12.997557561Z", id: account:1pafmu53haty8x8uanpk, name: "ACME Inc" };

-- ------------------------------
-- TABLE DATA: article
-- ------------------------------

UPDATE article:2r71nzpabxzssbo7syaz CONTENT { account: account:2r71nzpabxzssbo7syaz, author: [author:john, author:jake], created_at: "2023-03-10T14:59:12.998398420Z", id: article:2r71nzpabxzssbo7syaz, text: "Integer a tellus tempus, convallis libero a, consectetur magna. Aliquam nunc ipsum, tristique eu tortor in, blandit efficitur velit. Nam venenatis semper sem nec faucibus.", title: "Sed mi tellus, luctus in elit ac, vehicula ultrices ligula." };
UPDATE article:p6a13snp0ka9z94qpabl CONTENT { account: account:1pafmu53haty8x8uanpk, author: [author:john], created_at: "2023-03-10T14:59:12.997864810Z", id: article:p6a13snp0ka9z94qpabl, text: "Donec eleifend, nunc vitae commodo accumsan, mauris est fringilla.", title: "Lorem ipsum dolor" };
UPDATE article:xnrc1f3ndn86j70z6851 CONTENT { account: account:1pafmu53haty8x8uanpk, author: [author:john], created_at: "2023-03-10T14:59:12.998139944Z", id: article:xnrc1f3ndn86j70z6851, text: "Donec ornare id elit id sollicitudin. Nam imperdiet vulputate diam, facilisis feugiat dui. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Aenean eu nisl quis dui interdum gravida. Nulla ut nisi lectus. Morbi molestie et sem vitae rhoncus. Donec eu augue velit. Suspendisse eu eros tristique, molestie turpis vel, posuere ex. Maecenas eget tempus velit, at suscipit lacus.", title: "In risus velit, porttitor a eleifend nec, imperdiet eget lectus." };

-- ------------------------------
-- TABLE DATA: author
-- ------------------------------

UPDATE author:jake CONTENT { admin: true, age: 26, id: author:jake, name: { first: "Jake", full: "Jake Baker", last: "Baker" }, signup_at: time::now() };
UPDATE author:john CONTENT { admin: true, age: 29, id: author:john, name: { first: "John", full: "John Adams", last: "Adams" }, signup_at: time::now() };
UPDATE author:user CONTENT { admin: true, age: 42, id: author:user, name: { first: "Bob", full: "Bob Turbid", last: "Turbid" }, signup_at: time::now() };
-- ------------------------------
-- TABLE DATA: scopeusers
-- ------------------------------

UPDATE scopeusers:rqt1qxbq7m46bj7fycjt CONTENT { id: scopeusers:rqt1qxbq7m46bj7fycjt, pass: "$argon2id$v=19$m=4096,t=3,p=1$HqOIgdEqfRD2WS/T4OFLaQ$WxgwD9FITIi+G8LNl6S5sb5RuRP/+gzCVSKTytb3FK4", user: author:user };

-- ------------------------------
-- TRANSACTION
-- ------------------------------

COMMIT TRANSACTION;

