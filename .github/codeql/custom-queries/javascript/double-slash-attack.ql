/**
 * @name Double Slash Attack vulnerability
 * @description Path traversal via double slash can lead to unauthorized access.
 * @kind path-problem
 * @problem.severity error
 * @security-severity 8.1
 * @precision high
 * @id js/double-slash-attack
 * @tags security
 *       external/cwe/cwe-022
 */

 import javascript
 import DataFlow::PathGraph
 
 class DoubleSlashSource extends DataFlow::Node {
   DoubleSlashSource() {
     exists(DataFlow::Node node |
       (
         // HTTP request parameters
         node.asExpr() instanceof Express::RequestParameterAccess or
         // URL parameters from Next.js
         exists(DataFlow::CallNode call |
           call.getCalleeName() = "useRouter" and
           node = call.getAPropertyRead("query").getAPropertyRead()
         )
       ) and
       this = node
     )
   }
 }
 
 class DoubleSlashSink extends DataFlow::Node {
   DoubleSlashSink() {
     exists(DataFlow::CallNode call |
       (
         // File system operations
         call.getCalleeName() in ["readFile", "readFileSync", "writeFile", "writeFileSync", "appendFile", "appendFileSync"] or
         // Path resolution functions
         call.getCalleeName() in ["resolve", "join", "normalize"] or
         // URL construction
         call.getCalleeName() in ["fetch", "get", "post", "put", "delete"]
       ) and
       this = call.getAnArgument()
     )
   }
 }
 
 class DoubleSlashConfiguration extends DataFlow::Configuration {
   DoubleSlashConfiguration() { this = "DoubleSlashConfiguration" }
 
   override predicate isSource(DataFlow::Node source) {
     source instanceof DoubleSlashSource
   }
 
   override predicate isSink(DataFlow::Node sink) {
     sink instanceof DoubleSlashSink
   }
 
   override predicate isAdditionalFlowStep(DataFlow::Node pred, DataFlow::Node succ) {
     // Track flow through template literals and string concatenation
     exists(DataFlow::StringConcatenationNode strConcatNode |
       pred = strConcatNode.getAnOperand() and
       succ = strConcatNode
     )
     or
     // Track flow through string replacement that doesn't properly sanitize paths
     exists(DataFlow::MethodCallNode replace |
       replace.getMethodName() = "replace" and
       replace.getReceiver() = pred and
       not exists(DataFlow::Node pattern |
         pattern = replace.getArgument(0) and
         pattern.getStringValue().regexpMatch(".*\\/\\/.*")
       ) and
       succ = replace
     )
   }
 
   override predicate hasFlowPath(DataFlow::PathNode source, DataFlow::PathNode sink) {
     super.hasFlowPath(source, sink)
   }
 }
 
 from DoubleSlashConfiguration config, DataFlow::PathNode source, DataFlow::PathNode sink
 where config.hasFlowPath(source, sink)
 select sink.getNode(), source, sink, "Potential double slash attack from $@", source.getNode(), "user-controlled input"