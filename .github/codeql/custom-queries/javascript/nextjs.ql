/**
 * @name Simulated SQL Injection
 * @description Detects simulated SQL injection patterns in test code
 * @kind path-problem
 * @problem.severity error
 * @id js/simulated-sql-injection
 */

import javascript

from DataFlow::Node source, DataFlow::Node sink
where
  exists(StringOps::Concatenation conc |
    conc.getAnOperand().asExpr().(CallExpr).getCalleeName().matches("%get%") and
    conc.getStringValue().toLowerCase().matches("%select%from%where%") and
    source = conc.getAnOperand() and
    sink = conc
  )
select sink, source, sink, "Potential SQL injection through string concatenation"
