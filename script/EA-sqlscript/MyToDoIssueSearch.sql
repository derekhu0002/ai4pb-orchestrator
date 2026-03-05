SELECT t_object.Name as [Element], t_objectproblems.Object_ID, t_objectproblems.Problem, t_objectproblems.ProblemNotes, t_objectproblems.ResolverNotes, t_objectproblems.Status, t_objectproblems.Priority, t_objectproblems.ResolvedBy, t_objectproblems.ProblemType, 't_objectproblems' as CLASSTABLE
FROM t_objectproblems, t_object
WHERE
(t_objectproblems.ProblemType = 'ToDo' OR t_objectproblems.ProblemType = 'Issue') AND
t_objectproblems.Object_ID = t_object.Object_ID AND
t_objectproblems.DateReported IS NOT NULL AND
t_objectproblems.DateReported >= #Now - 100000# AND
t_objectproblems.DateReported < #Now +1d# AND
t_objectproblems.ResolvedBy = 'llm' AND
(t_objectproblems.Status = 'Active' OR t_objectproblems.Status = 'Verified')


ORDER BY
 t_objectproblems.ResolvedBy ASC