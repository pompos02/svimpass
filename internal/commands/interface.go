package commands

import "context"

type Command interface {
	Execute(ctx context.Context) (any, error)
}
