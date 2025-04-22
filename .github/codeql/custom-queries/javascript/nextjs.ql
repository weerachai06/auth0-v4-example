/**
 * @name Insecure Server-Side Props Fetching
 * @description Detects potentially insecure data fetching in getServerSideProps without proper validation
 * @kind problem
 * @problem.severity warning
 * @precision high
 * @id js/nextjs/insecure-server-side-props
 * @tags security
 *       nextjs
 */

 import javascript

 // Identify getServerSideProps functions
 class GetServerSidePropsFunction extends Function {
   GetServerSidePropsFunction() {
     this.getName() = "getServerSideProps"
   }
 }
 
 // Identify API route handlers
 class NextApiRouteHandler extends Function {
   NextApiRouteHandler() {
     exists(CallExpr call |
       call.getCalleeName() = "createHandler" or
       call.getCalleeName() = "handler" or
       call.getCalleeName().matches("%Handler")
     ) and
     this = call.getAnArgument()
   }
 }
 
 // Identify potentially dangerous operations
 class DangerousOperation extends DataFlow::Node {
   DangerousOperation() {
     // Check for unvalidated request params or query usage
     exists(DataFlow::PropRead read |
       read.getPropertyName() = "query" or
       read.getPropertyName() = "params" or
       read.getPropertyName() = "body"
     |
       read.getBase().getALocalSource() = this.getAPredecessor*() and
       not exists(MethodCallExpr validate |
         validate.getMethodName().matches("%validate%") and
         validate.getReceiver() = read.asExpr()
       )
     )
     or
     // Direct SQL queries with possible injection
     exists(CallExpr call |
       call.getCalleeName() = "query" or
       call.getCalleeName() = "execute" or
       call.getCalleeName() = "raw"
     |
       call = this.asExpr() and
       exists(DataFlow::PropRead read |
         read.getPropertyName() = "query" or
         read.getPropertyName() = "params" or
         read.getPropertyName() = "body"
       |
         read.getBase().getALocalSource().flowsToExpr(call.getAnArgument())
       )
     )
   }
 }
 
 from DataFlow::FunctionNode func, DangerousOperation op
 where 
   (func.getFunction() instanceof GetServerSidePropsFunction or
    func.getFunction() instanceof NextApiRouteHandler) and
   op.getEnclosingFunction() = func.getFunction()
 select op, "Potentially unsafe operation with unvalidated user input in " + func.getFunction().getName()
 
 
 /**
  * @name Missing API Route Input Validation
  * @description API routes should validate input parameters 
  * @kind problem
  * @problem.severity warning
  * @precision medium
  * @id js/nextjs/missing-api-validation
  * @tags security
  *       nextjs
  *       api
  */
 
 import javascript
 
 // Identify API routes in Next.js
 class NextApiRoute extends File {
   NextApiRoute() {
     this.getAbsolutePath().regexpMatch(".*/pages/api/.*\\.(js|ts|jsx|tsx)$")
   }
 }
 
 // Check for validation libraries or patterns
 predicate hasValidation(Function f) {
   exists(ImportDeclaration imp |
     imp.getImportedPath().getValue().matches("%joi%") or
     imp.getImportedPath().getValue().matches("%yup%") or
     imp.getImportedPath().getValue().matches("%validator%") or
     imp.getImportedPath().getValue().matches("%zod%")
   |
     imp.getFile() = f.getFile()
   )
   or
   exists(CallExpr call |
     call.getCalleeName().matches("%validate%") or
     call.getCalleeName().matches("%check%") or
     call.getCalleeName().matches("%assert%") or
     call.getCalleeName().matches("%sanitize%")
   |
     call.getEnclosingFunction() = f
   )
 }
 
 from NextApiRoute apiRoute, Function f
 where 
   f.getFile() = apiRoute and
   // Export default handler function pattern
   (f.isExported() or exists(ExportDeclaration export | export.getFile() = apiRoute)) and
   not hasValidation(f)
 select f, "API route handler lacks proper input validation"
 
 
 /**
  * @name Potential XSS in dangerouslySetInnerHTML
  * @description Detects usage of dangerouslySetInnerHTML with potentially unsafe data
  * @kind path-problem
  * @problem.severity warning
  * @precision high
  * @id js/nextjs/dangerous-inner-html
  * @tags security
  *       xss
  *       nextjs
  */
 
 import javascript
 import DataFlow::PathGraph
 
 class DangerousInnerHtmlSink extends DataFlow::Node {
   DangerousInnerHtmlSink() {
     exists(DataFlow::PropWrite write |
       write.getPropertyName() = "dangerouslySetInnerHTML" and
       this = write.getRhs()
     )
   }
 }
 
 class UserInputSource extends DataFlow::Node {
   UserInputSource() {
     exists(DataFlow::PropRead read |
       (
         read.getPropertyName() = "query" or
         read.getPropertyName() = "params" or
         read.getPropertyName() = "body"
       ) and
       this = read
     )
     or
     // localStorage, sessionStorage access
     exists(DataFlow::MethodCallNode call |
       call.getMethodName() = "getItem" and
       (
         call.getReceiver().asExpr().(VarAccess).getName() = "localStorage" or
         call.getReceiver().asExpr().(VarAccess).getName() = "sessionStorage"
       ) and
       this = call
     )
     or
     // Fetch calls
     exists(DataFlow::MethodCallNode call |
       (
         call.getMethodName() = "fetch" or
         call.getMethodName() = "get" or
         call.getMethodName() = "post"
       ) and
       this = call
     )
   }
 }
 
 class DangerousInnerHtmlConfig extends DataFlow::Configuration {
   DangerousInnerHtmlConfig() { this = "DangerousInnerHtmlConfig" }
 
   override predicate isSource(DataFlow::Node source) {
     source instanceof UserInputSource
   }
 
   override predicate isSink(DataFlow::Node sink) {
     sink instanceof DangerousInnerHtmlSink
   }
   
   override predicate isBarrier(DataFlow::Node node) {
     exists(CallExpr call |
       call.getCalleeName().matches("%sanitize%") or
       call.getCalleeName().matches("%escape%") or
       call.getCalleeName().matches("%purify%") or
       call.getCalleeName() = "DOMPurify" or
       call.getCalleeName() = "sanitizeHtml"
     |
       node.asExpr() = call
     )
   }
 }
 
 from DangerousInnerHtmlConfig config, DataFlow::PathNode source, DataFlow::PathNode sink
 where config.hasFlowPath(source, sink)
 select sink.getNode(), source, sink, "Potentially unsafe data from $@ is used in dangerouslySetInnerHTML", source.getNode(), "user input"
 
 
 /**
  * @name Insecure Direct Object Reference (IDOR)
  * @description Detects potential IDOR vulnerabilities in Next.js API routes
  * @kind path-problem
  * @problem.severity warning
  * @precision medium
  * @id js/nextjs/idor
  * @tags security
  *       api
  *       nextjs
  */
 
 import javascript
 import DataFlow::PathGraph
 
 class IdorSource extends DataFlow::Node {
   IdorSource() {
     exists(DataFlow::PropRead read |
       (
         read.getPropertyName() = "id" or
         read.getPropertyName() = "userId" or
         read.getPropertyName().matches("%Id") or
         read.getPropertyName().matches("%_id")
       ) and
       exists(DataFlow::PropRead parent |
         (
           parent.getPropertyName() = "query" or
           parent.getPropertyName() = "params" or
           parent.getPropertyName() = "body"
         ) and
         read.getBase() = parent
       ) and
       this = read
     )
   }
 }
 
 class DatabaseAccessSink extends DataFlow::Node {
   DatabaseAccessSink() {
     exists(MethodCallExpr call |
       (
         call.getMethodName() = "findById" or
         call.getMethodName() = "findOne" or
         call.getMethodName() = "deleteOne" or
         call.getMethodName() = "updateOne" or
         call.getMethodName() = "findByPk" or
         call.getMethodName().matches("find%") or
         call.getMethodName().matches("get%") or
         call.getMethodName() = "query" or
         call.getMethodName() = "execute"
       ) and
       this.asExpr() = call.getAnArgument()
     )
   }
 }
 
 class AuthCheckFunction extends Function {
   AuthCheckFunction() {
     this.getName().matches("%auth%") or
     this.getName().matches("%authorize%") or
     this.getName().matches("%checkPermission%") or
     this.getName().matches("%can%") or
     this.getName().matches("%isAllowed%")
   }
 }
 
 class IdorConfig extends DataFlow::Configuration {
   IdorConfig() { this = "IdorConfig" }
 
   override predicate isSource(DataFlow::Node source) {
     source instanceof IdorSource
   }
 
   override predicate isSink(DataFlow::Node sink) {
     sink instanceof DatabaseAccessSink
   }
   
   override predicate isBarrier(DataFlow::Node node) {
     // Check for authorization calls
     exists(CallExpr call |
       call.getCalleeName().matches("%auth%") or
       call.getCalleeName().matches("%check%") or
       call.getCalleeName().matches("%verify%") or
       call.getCalleeName().matches("%validate%") or
       call.getCalleeName().matches("%can%") or
       call.getCalleeName().matches("%permission%")
     |
       node.asExpr() = call
     )
     or
     // Check for token verification
     exists(CallExpr call |
       call.getCalleeName() = "verify" or
       call.getCalleeName() = "decode"
     |
       node.asExpr() = call
     )
   }
 }
 
 from IdorConfig config, DataFlow::PathNode source, DataFlow::PathNode sink, File file
 where 
   config.hasFlowPath(source, sink) and
   file = sink.getNode().asExpr().getFile() and
   file.getAbsolutePath().regexpMatch(".*/pages/api/.*\\.(js|ts|jsx|tsx)$") and
   not exists(AuthCheckFunction authFunc |
     authFunc.getFile() = file and
     exists(CallExpr call | 
       call.getCallee() = authFunc and
       call.getEnclosingFunction() = sink.getNode().asExpr().getEnclosingFunction()
     )
   )
 select sink.getNode(), source, sink, "Potential IDOR vulnerability: User-controlled ID $@ is used in database query without proper authorization", source.getNode(), "from request"
 
 
 /**
  * @name Missing CSRF Protection
  * @description Detects Next.js API routes that may be missing CSRF protection
  * @kind problem
  * @problem.severity warning
  * @precision medium
  * @id js/nextjs/missing-csrf-protection
  * @tags security
  *       csrf
  *       nextjs
  */
 
 import javascript
 
 predicate hasCsrfProtection(File file) {
   // Check for common CSRF libraries or middleware
   exists(ImportDeclaration imp |
     imp.getImportedPath().getValue().matches("%csrf%") or
     imp.getImportedPath().getValue().matches("%csurf%") or
     imp.getImportedPath().getValue().matches("%next-csrf%")
   |
     imp.getFile() = file
   )
   or
   // Check for common CSRF validation patterns
   exists(Function f |
     f.getFile() = file and
     exists(CallExpr call |
       call.getCalleeName().matches("%csrf%") or
       call.getCalleeName().matches("%validateToken%") or
       call.getCalleeName().matches("%verifyToken%")
     |
       call.getEnclosingFunction() = f
     )
   )
 }
 
 // Detect mutating HTTP methods that should have CSRF protection
 predicate isMutatingApiHandler(Function f, File file) {
   file.getAbsolutePath().regexpMatch(".*/pages/api/.*\\.(js|ts|jsx|tsx)$") and
   f.getFile() = file and
   (
     // Check for explicit handling of mutating HTTP methods
     exists(DataFlow::PropRead read, IfStmt ifstmt |
       read.getPropertyName() = "method" and
       (
         read.asExpr() = ifstmt.getCondition().(EqualityTest).getAnOperand() or
         read.asExpr() = ifstmt.getCondition().(LogicalExpr).getAnOperand()
       ) and
       ifstmt.getEnclosingFunction() = f and
       exists(StringLiteral str |
         str.getValue() = "POST" or
         str.getValue() = "PUT" or
         str.getValue() = "PATCH" or
         str.getValue() = "DELETE"
       |
         str = ifstmt.getCondition().(EqualityTest).getAnOperand() or
         str = ifstmt.getCondition().(LogicalExpr).getAnOperand()
       )
     )
   )
 }
 
 from Function f, File file
 where 
   isMutatingApiHandler(f, file) and
   not hasCsrfProtection(file)
 select f, "API route handling mutating HTTP methods may be missing CSRF protection"
 
 
 /**
  * @name Hardcoded Secrets
  * @description Detects hardcoded secrets or credentials in Next.js application
  * @kind problem
  * @problem.severity warning
  * @precision high
  * @id js/nextjs/hardcoded-secrets
  * @tags security
  *       nextjs
  *       secrets
  */
 
 import javascript
 
 from StringLiteral str
 where 
   // Look for string literals that appear to be secrets
   (
     str.getValue().regexpMatch("(?i).*secret.*") or
     str.getValue().regexpMatch("(?i).*password.*") or
     str.getValue().regexpMatch("(?i).*api[_-]?key.*") or
     str.getValue().regexpMatch("(?i).*auth[_-]?token.*") or
     str.getValue().regexpMatch("(?i).*access[_-]?token.*") or
     str.getValue().regexpMatch("(?i).*client[_-]?secret.*") or
     // JWT pattern
     str.getValue().regexpMatch("ey[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9._-]{10,}") or
     // API key patterns
     str.getValue().regexpMatch("[A-Za-z0-9]{32,}") or
     str.getValue().regexpMatch("sk_[live|test]_[0-9a-zA-Z]{24,}") or  // Stripe
     str.getValue().regexpMatch("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}") or // UUID
     str.getValue().regexpMatch("AIza[0-9A-Za-z-_]{35}")  // Google API
   ) and
   // Not in environment variable usage
   not exists(PropAccess access |
     access.getPropertyName().regexpMatch("env") and
     access.getBase().(VarAccess).getName() = "process"
   |
     access.getParent*() = str.getParent*()
   ) and
   // Not in a test file
   not str.getFile().getAbsolutePath().regexpMatch(".*(test|spec)\\.(js|ts|jsx|tsx)$") and
   // At least 8 chars to avoid false positives on short strings
   str.getValue().length() >= 8
 select str, "Potential hardcoded secret found: " + str.getValue().substring(0, 10) + "..."
 
 
 /**
  * @name Unsafe Next.js API Route Usage
  * @description Identifies API routes that improperly use Next.js handlers
  * @kind problem
  * @problem.severity warning
  * @precision high
  * @id js/nextjs/improper-api-handler
  * @tags security
  *       api
  *       nextjs
  */
 
 import javascript
 
 // Check for improper response sending without proper status handling
 from CallExpr responseCall, Function apiHandler
 where 
   apiHandler.getFile().getAbsolutePath().regexpMatch(".*/pages/api/.*\\.(js|ts|jsx|tsx)$") and
   responseCall.getEnclosingFunction() = apiHandler and
   (
     // Direct response sending without error handling
     responseCall.getCalleeName() = "json" or 
     responseCall.getCalleeName() = "send" or
     responseCall.getCalleeName() = "end"
   ) and
   // No proper error handling
   not exists(TryStmt tryStmt | 
     tryStmt.getEnclosingFunction() = apiHandler and
     tryStmt.getBody().getAChildStmt*() = responseCall.getAStmt()
   ) and
   // No status method call before response
   not exists(CallExpr statusCall |
     statusCall.getCalleeName() = "status" and
     statusCall.getEnclosingFunction() = apiHandler and
     statusCall.getAStmt().getIndex() < responseCall.getAStmt().getIndex()
   )
 select responseCall, "API route sends response without proper status handling or error catching"
 
 
 /**
  * @name Unprotected Next.js API Route
  * @description Detects API routes without any form of authentication
  * @kind problem
  * @problem.severity warning
  * @precision medium
  * @id js/nextjs/unprotected-api-route
  * @tags security
  *       api
  *       nextjs
  */
 
 import javascript
 
 predicate hasAuthCheck(File file) {
   // Check for authentication middleware or checks
   exists(ImportDeclaration imp |
     imp.getImportedPath().getValue().matches("%auth%") or
     imp.getImportedPath().getValue().matches("%session%") or
     imp.getImportedPath().getValue().matches("%passport%") or
     imp.getImportedPath().getValue().matches("%jwt%") or
     imp.getImportedPath().getValue().matches("%token%")
   |
     imp.getFile() = file
   )
   or
   // Check for common auth validation patterns
   exists(CallExpr call |
     (
       call.getCalleeName().matches("%authenticate%") or
       call.getCalleeName().matches("%authorize%") or
       call.getCalleeName().matches("%requireAuth%") or
       call.getCalleeName().matches("%isAuthenticated%") or
       call.getCalleeName().matches("%verify%") or
       call.getCalleeName().matches("%checkAuth%") or
       call.getCalleeName().matches("%withAuth%")
     )
   |
     call.getFile() = file
   )
   or
   // Check for token verification patterns
   exists(PropRead read |
     read.getPropertyName() = "authorization" or
     read.getPropertyName() = "cookie" or
     read.getPropertyName() = "session"
   |
     read.getFile() = file
   )
 }
 
 from File apiFile, Function exportedFunc
 where 
   apiFile.getAbsolutePath().regexpMatch(".*/pages/api/.*\\.(js|ts|jsx|tsx)$") and
   // Exclude public API endpoints like health checks
   not apiFile.getAbsolutePath().regexpMatch(".*/pages/api/(health|ping|status)\\.(js|ts|jsx|tsx)$") and
   exportedFunc.getFile() = apiFile and
   exportedFunc.isExported() and
   not hasAuthCheck(apiFile)
 select apiFile, "API route may lack authentication checks"
 
 
 /**
  * @name Potential Memory Leak in Next.js Components
  * @description Detects event listeners that are not properly cleaned up in useEffect hooks
  * @kind problem
  * @problem.severity warning
  * @precision medium
  * @id js/nextjs/memory-leak
  * @tags memory
  *       nextjs
  *       performance
  */
 
 import javascript
 
 // Identify React function components
 class ReactFunctionComponent extends Function {
   ReactFunctionComponent() {
     // Look for function components (PascalCase naming)
     this.getName().regexpMatch("[A-Z][a-zA-Z0-9]*") and
     // Component returns JSX
     exists(ReturnStmt ret |
       ret.getEnclosingFunction() = this and
       (
         // JSX element
         ret.getExpr() instanceof JSXElement or
         // Fragment shorthand <>...</>
         ret.getExpr() instanceof JSXFragment
       )
     )
   }
 }
 
 // Find useEffect hooks that add event listeners but don't clean them up
 from CallExpr useEffectCall, Function effectCallback, MethodCallExpr addEventListenerCall
 where 
   useEffectCall.getCalleeName() = "useEffect" and
   effectCallback = useEffectCall.getArgument(0) and
   addEventListenerCall.getMethodName() = "addEventListener" and
   addEventListenerCall.getEnclosingFunction() = effectCallback and
   // No cleanup function
   not exists(ReturnStmt ret |
     ret.getEnclosingFunction() = effectCallback and
     // Check for removeEventListener in cleanup function
     exists(Function cleanupFunc | 
       cleanupFunc = ret.getExpr() and
       exists(MethodCallExpr removeEventListenerCall |
         removeEventListenerCall.getMethodName() = "removeEventListener" and
         removeEventListenerCall.getEnclosingFunction() = cleanupFunc
       )
     )
   )
 select addEventListenerCall, "Event listener is added in useEffect without cleanup, potentially causing memory leaks"
 
 
 /**
  * @name Insecure Resource Loading
  * @description Detects insecure resource loading in Next.js components
  * @kind problem
  * @problem.severity warning
  * @precision high
  * @id js/nextjs/insecure-resource
  * @tags security
  *       nextjs
  */
 
 import javascript
 
 // Find instances of insecure script or resource loading
 from JSXElement element, JSXAttribute attribute, StringLiteral srcValue
 where 
   // Targeting script, img, iframe, link tags
   (
     element.getNameExpr().getName() = "script" or
     element.getNameExpr().getName() = "img" or
     element.getNameExpr().getName() = "iframe" or
     element.getNameExpr().getName() = "link"
   ) and
   (
     attribute.getName() = "src" or
     attribute.getName() = "href"
   ) and
   attribute.getElement() = element and
   srcValue = attribute.getValue() and
   // Check for HTTP URLs (not HTTPS)
   srcValue.getValue().regexpMatch("http://.*") and
   // Not in development or test files
   not element.getFile().getAbsolutePath().regexpMatch(".*(test|spec|dev)\\.(js|ts|jsx|tsx)$")
 select element, "Insecure resource loading with HTTP URL: " + srcValue.getValue()
 
 
 /**
  * @name Missing Content Security Policy
  * @description Detects Next.js applications without proper Content Security Policy
  * @kind problem
  * @problem.severity warning
  * @precision high
  * @id js/nextjs/missing-csp
  * @tags security
  *       nextjs
  *       csp
  */
 
 import javascript
 
 // Check for existence of CSP configuration
 predicate hasCSPConfig(Project project) {
   exists(File configFile |
     (
       configFile.getBaseName() = "next.config.js" or
       configFile.getBaseName() = "next.config.mjs" or
       configFile.getBaseName() = "next.config.ts"
     )
   |
     // Look for Content-Security-Policy in the config
     exists(StringLiteral str |
       str.getFile() = configFile and
       (
         str.getValue().regexpMatch(".*Content-Security-Policy.*") or
         str.getValue().regexpMatch(".*csp.*")
       )
     )
   )
   or
   // Check for _document.js with CSP headers
   exists(File documentFile |
     documentFile.getAbsolutePath().regexpMatch(".*/pages/_document\\.(js|ts|jsx|tsx)$")
   |
     exists(StringLiteral str |
       str.getFile() = documentFile and
       (
         str.getValue().regexpMatch(".*Content-Security-Policy.*") or
         str.getValue() = "content-security-policy"
       )
     )
   )
   or
   // Check for CSP middleware
   exists(File middlewareFile |
     middlewareFile.getBaseName() = "middleware.js" or
     middlewareFile.getBaseName() = "middleware.ts"
   |
     exists(StringLiteral str |
       str.getFile() = middlewareFile and
       (
         str.getValue().regexpMatch(".*Content-Security-Policy.*") or
         str.getValue() = "content-security-policy"
       )
     )
   )
 }
 
 // Find Next.js projects
 from Folder projectRoot
 where 
   // Look for Next.js project markers
   exists(File packageJson |
     packageJson.getBaseName() = "package.json" and
     packageJson.getParentContainer() = projectRoot and
     exists(StringLiteral str |
       str.getFile() = packageJson and
       str.getValue() = "next"
     )
   ) and
   // Project is not a template or example
   not projectRoot.getBaseName().matches("%example%") and
   not projectRoot.getBaseName().matches("%template%") and
   // Has production code
   exists(Folder pagesFolder |
     pagesFolder.getBaseName() = "pages" and
     pagesFolder.getParentContainer() = projectRoot
   ) and
   // No CSP configuration found
   not hasCSPConfig(projectRoot)
 select projectRoot, "Next.js application may be missing Content Security Policy (CSP) configuration"