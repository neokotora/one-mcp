package handler

import "testing"

func TestExtractPackageNameWithoutVersion_PreservesGitSource(t *testing.T) {
	input := "git+https://github.com/GuDaStudio/GrokSearch.git@grok-with-tavily"
	if got := extractPackageNameWithoutVersion(input); got != input {
		t.Fatalf("expected git source to be preserved, got %q", got)
	}
}

func TestDetermineUVSourceKind(t *testing.T) {
	tests := []struct {
		name      string
		sourceRef string
		args      []string
		want      string
	}{
		{name: "git source ref", sourceRef: "git+https://github.com/example/repo.git@main", want: "git"},
		{name: "pypi source ref", sourceRef: "grok-search", want: "pypi"},
		{name: "git from args", args: []string{"--native-tls", "--from", "git+https://github.com/example/repo.git@main", "grok-search"}, want: "git"},
		{name: "pypi from args", args: []string{"--from", "grok-search", "grok-search"}, want: "pypi"},
		{name: "plain command", args: []string{"grok-search"}, want: "pypi"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := determineUVSourceKind(tt.sourceRef, tt.args); got != tt.want {
				t.Fatalf("expected %q, got %q", tt.want, got)
			}
		})
	}
}
