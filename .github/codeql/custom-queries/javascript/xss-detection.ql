/**
 * @name Cross-site scripting vulnerability
 * @description Using unvalidated user input in a client-side context can enable cross-site scripting attacks.
 * @kind path-problem
 * @problem.severity error
 * @security-severity 6.1
 * @precision high
 * @id js/xss
 * @tags security
 *       external/cwe/cwe-079
 *       external/cwe/cwe-116
 */

import javascript
import DataFlow::PathGraph
import semmle.javascript.security.dataflow.DomBasedXssCustomizations::DomBasedXss
import semmle.javascript.security.dataflow.ReflectedXssCustomizations::ReflectedXss
import semmle.javascript.security.dataflow.StoredXssCustomizations::StoredXss

// Custom XSS sinks for React-based applications
class ReactDangerouslySetInnerHTML extends DomBasedXss::Sink {
  ReactDangerouslySetInnerHTML() {
    exists(DataFlow::PropWrite pwn |
      pwn.getPropertyName() = "dangerouslySetInnerHTML" and
      pwn.getRhs() = this
    )
  }
}

// Custom XSS sinks for Next.js applications
class NextJsUnsafeHtml extends DomBasedXss::Sink {
  NextJsUnsafeHtml() {
    exists(DataFlow::CallNode call |
      call.getCalleeName() = "useRouter" and
      this = call.getAPropertyRead("query").getAPropertyRead()
    )
  }
}

from DataFlow::Configuration cfg, DataFlow::PathNode source, DataFlow::PathNode sink
where cfg.hasFlowPath(source, sink) and
      (cfg instanceof DomBasedXss::Configuration or 
       cfg instanceof ReflectedXss::Configuration or 
       cfg instanceof StoredXss::Configuration)
select sink.getNode(), source, sink, "Potential XSS vulnerability due to $@.", source.getNode(), "user-controlled data"