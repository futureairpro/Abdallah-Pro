Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\scheduler_daemon.js""", 0, False
